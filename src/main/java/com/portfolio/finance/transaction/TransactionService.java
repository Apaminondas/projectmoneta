package com.portfolio.finance.transaction;

import com.portfolio.finance.category.Category;
import com.portfolio.finance.category.CategoryService;
import com.portfolio.finance.exception.BusinessException;
import com.portfolio.finance.exception.InvalidValueException;
import com.portfolio.finance.exception.ResourceNotFoundException;
import com.portfolio.finance.notification.NotificationService;
import com.portfolio.finance.transaction.dto.TransactionRequest;
import com.portfolio.finance.transaction.dto.TransactionResponse;
import com.portfolio.finance.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

import static com.portfolio.finance.transaction.TransactionSpecifications.belongsTo;
import static com.portfolio.finance.transaction.TransactionSpecifications.dateFrom;
import static com.portfolio.finance.transaction.TransactionSpecifications.dateUntil;
import static com.portfolio.finance.transaction.TransactionSpecifications.inCategory;

@Service
public class TransactionService {

    static final String NON_POSITIVE_AMOUNT_MESSAGE = "valor deve ser maior que zero";
    static final String FUTURE_EXPENSE_MESSAGE = "Despesa não pode ser lançada com data futura";

    private static final Sort DEFAULT_SORT = Sort.by(Sort.Order.desc("date"), Sort.Order.desc("id"));

    private final TransactionRepository transactionRepository;
    private final CategoryService categoryService;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final Clock clock;

    public TransactionService(TransactionRepository transactionRepository,
                              CategoryService categoryService,
                              UserRepository userRepository,
                              NotificationService notificationService,
                              Clock clock) {
        this.transactionRepository = transactionRepository;
        this.categoryService = categoryService;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> list(Long userId, LocalDate startDate, LocalDate endDate, Long categoryId) {
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new InvalidValueException("startDate", "startDate não pode ser posterior a endDate");
        }
        var spec = belongsTo(userId)
                .and(dateFrom(startDate))
                .and(dateUntil(endDate))
                .and(inCategory(categoryId));
        return transactionRepository.findAll(spec, DEFAULT_SORT).stream()
                .map(TransactionResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<TransactionResponse> listPage(Long userId, LocalDate startDate, LocalDate endDate,
                                              Long categoryId, int page, int size) {
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new InvalidValueException("startDate", "startDate não pode ser posterior a endDate");
        }
        var spec = belongsTo(userId)
                .and(dateFrom(startDate))
                .and(dateUntil(endDate))
                .and(inCategory(categoryId));
        int safeSize = Math.min(Math.max(size, 1), 500);
        return transactionRepository.findAll(spec, PageRequest.of(Math.max(page, 0), safeSize, DEFAULT_SORT))
                .map(TransactionResponse::from);
    }

    @Transactional(readOnly = true)
    public TransactionResponse get(Long id, Long userId) {
        return TransactionResponse.from(findOwned(id, userId));
    }

    @Transactional
    public TransactionResponse create(TransactionRequest request, Long userId) {
        validateBusinessRules(request);
        Category category = categoryService.findOwned(request.categoryId(), userId);
        Transaction transaction = new Transaction(
                request.description().trim(),
                request.amount(),
                request.date(),
                request.type(),
                request.status(),
                request.paymentMethod() != null ? request.paymentMethod().trim() : null,
                request.notes() != null ? request.notes().trim() : null,
                category,
                userRepository.getReferenceById(userId)
        );
        Transaction saved = transactionRepository.save(transaction);
        checkAndTriggerNotifications(saved, category, userId);
        return TransactionResponse.from(saved);
    }

    @Transactional
    public TransactionResponse update(Long id, TransactionRequest request, Long userId) {
        Transaction transaction = findOwned(id, userId);
        validateBusinessRules(request);
        Category category = categoryService.findOwned(request.categoryId(), userId);
        transaction.update(
                request.description().trim(),
                request.amount(),
                request.date(),
                request.type(),
                request.status(),
                request.paymentMethod() != null ? request.paymentMethod().trim() : null,
                request.notes() != null ? request.notes().trim() : null,
                category
        );
        return TransactionResponse.from(transaction);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        transactionRepository.delete(findOwned(id, userId));
    }

    /**
     * Regras 1 e 2. A regra 1 também é validada via Bean Validation no DTO; a checagem aqui
     * garante a regra mesmo que o serviço seja chamado por outro ponto de entrada.
     */
    private void validateBusinessRules(TransactionRequest request) {
        // Regra 1: valor NUNCA pode ser negativo ou zero.
        BigDecimal amount = request.amount();
        if (amount == null || amount.signum() <= 0) {
            throw new InvalidValueException("amount", NON_POSITIVE_AMOUNT_MESSAGE);
        }
        // Regra 2: despesa NUNCA pode ter data futura (receita pode).
        if (request.type() == TransactionType.EXPENSE && request.date().isAfter(LocalDate.now(clock))) {
            throw new BusinessException(FUTURE_EXPENSE_MESSAGE);
        }
    }

    /**
     * Regra 3 (isolamento): lançamento de outro usuário é tratado como inexistente (404).
     */
    private Transaction findOwned(Long id, Long userId) {
        return transactionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Lançamento", id));
    }

    private void checkAndTriggerNotifications(Transaction transaction, Category category, Long userId) {
        if (notificationService == null) return;

        // 1. Notificação de Novo Lançamento (se ativado)
        if (notificationService.isNotificationEnabled(userId, "deal_updates")) {
            String kind = transaction.getType() == TransactionType.INCOME ? "Receita" : "Despesa";
            notificationService.createNotification(
                    userId,
                    "Novo Lançamento Registrado",
                    kind + " '" + transaction.getDescription() + "' no valor de R$ " + transaction.getAmount() + " registrada com sucesso.",
                    "NEW_TRANSACTION",
                    "deals"
            );
        }

        // 2. Alerta de Teto de Categoria / Centro de Custo (se ativado e despesa)
        if (transaction.getType() == TransactionType.EXPENSE && category != null
                && category.getMonthlyCeiling() != null && category.getMonthlyCeiling().compareTo(BigDecimal.ZERO) > 0
                && notificationService.isNotificationEnabled(userId, "team_activity")) {

            LocalDate txDate = transaction.getDate();
            LocalDate start = txDate.withDayOfMonth(1);
            LocalDate end = txDate.withDayOfMonth(txDate.lengthOfMonth());

            var spec = belongsTo(userId).and(dateFrom(start)).and(dateUntil(end)).and(inCategory(category.getId()));
            BigDecimal totalMonthlySpent = transactionRepository.findAll(spec).stream()
                    .filter(t -> t.getType() == TransactionType.EXPENSE)
                    .map(Transaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal ceiling = category.getMonthlyCeiling();
            BigDecimal ratio = totalMonthlySpent.divide(ceiling, 4, RoundingMode.HALF_UP);

            if (ratio.compareTo(new BigDecimal("1.0")) >= 0) {
                notificationService.createNotification(
                        userId,
                        "Teto Orçamentário Ultrapassado (100%)",
                        "A categoria '" + category.getName() + "' ultrapassou o teto mensal (R$ " + totalMonthlySpent + " de R$ " + ceiling + ").",
                        "CEILING_ALERT",
                        "team"
                );
            } else if (ratio.compareTo(new BigDecimal("0.8")) >= 0) {
                int pct = ratio.multiply(new BigDecimal(100)).intValue();
                notificationService.createNotification(
                        userId,
                        "Alerta de Teto (" + pct + "% atingido)",
                        "A categoria '" + category.getName() + "' atingiu " + pct + "% do limite mensal planejado.",
                        "CEILING_ALERT",
                        "team"
                );
            }
        }
    }
}

