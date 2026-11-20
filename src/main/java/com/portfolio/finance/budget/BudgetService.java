package com.portfolio.finance.budget;

import com.portfolio.finance.account.Contact;
import com.portfolio.finance.account.ContactRepository;
import com.portfolio.finance.account.dto.ContactDto;
import com.portfolio.finance.budget.dto.BudgetResponse;
import com.portfolio.finance.budget.dto.CostCenterDto;
import com.portfolio.finance.budget.dto.CostCenterUpdateRequest;
import com.portfolio.finance.category.Category;
import com.portfolio.finance.category.CategoryRepository;
import com.portfolio.finance.exception.ResourceNotFoundException;
import com.portfolio.finance.transaction.Transaction;
import com.portfolio.finance.transaction.TransactionRepository;
import com.portfolio.finance.transaction.TransactionType;
import com.portfolio.finance.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class BudgetService {

    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final ContactRepository contactRepository;

    public BudgetService(CategoryRepository categoryRepository,
                         TransactionRepository transactionRepository,
                         ContactRepository contactRepository) {
        this.categoryRepository = categoryRepository;
        this.transactionRepository = transactionRepository;
        this.contactRepository = contactRepository;
    }

    @Transactional(readOnly = true)
    public BudgetResponse getBudget(Long userId, LocalDate startDate, LocalDate endDate) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().with(TemporalAdjusters.firstDayOfMonth());
        LocalDate end = endDate != null ? endDate : LocalDate.now().with(TemporalAdjusters.lastDayOfMonth());

        // Mês anterior para cálculo da variação (changePct)
        LocalDate prevStart = start.minusMonths(1).with(TemporalAdjusters.firstDayOfMonth());
        LocalDate prevEnd = start.minusMonths(1).with(TemporalAdjusters.lastDayOfMonth());

        List<Category> categories = categoryRepository.findAllByUserIdOrderByNameAsc(userId);
        List<Transaction> transactions = transactionRepository.findAllByUserIdOrderByDateDesc(userId);

        // Agrupamento por categoria no período atual (apenas despesas)
        Map<Long, List<Transaction>> txsByCategory = transactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .filter(t -> t.getCategory() != null && t.getCategory().getId() != null)
                .filter(t -> !t.getDate().isBefore(start) && !t.getDate().isAfter(end))
                .collect(Collectors.groupingBy(t -> t.getCategory().getId()));

        // Agrupamento por categoria no período anterior
        Map<Long, List<Transaction>> prevTxsByCategory = transactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .filter(t -> t.getCategory() != null && t.getCategory().getId() != null)
                .filter(t -> !t.getDate().isBefore(prevStart) && !t.getDate().isAfter(prevEnd))
                .collect(Collectors.groupingBy(t -> t.getCategory().getId()));

        BigDecimal totalSpend = BigDecimal.ZERO;
        long totalTransactions = 0;
        int totalAdherenceSum = 0;
        int categoriesWithCeilingCount = 0;

        List<CostCenterDto> costCenters = new ArrayList<>();

        for (Category cat : categories) {
            List<Transaction> catTxs = txsByCategory.getOrDefault(cat.getId(), List.of());
            List<Transaction> prevCatTxs = prevTxsByCategory.getOrDefault(cat.getId(), List.of());

            BigDecimal spent = catTxs.stream()
                    .map(Transaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal prevSpent = prevCatTxs.stream()
                    .map(Transaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            long count = catTxs.size();
            totalSpend = totalSpend.add(spent);
            totalTransactions += count;

            BigDecimal ceiling = cat.getMonthlyCeiling() != null ? cat.getMonthlyCeiling() : BigDecimal.ZERO;

            int usagePct = 0;
            if (ceiling.compareTo(BigDecimal.ZERO) > 0) {
                usagePct = spent.multiply(BigDecimal.valueOf(100))
                        .divide(ceiling, 0, RoundingMode.HALF_UP)
                        .intValue();
                totalAdherenceSum += usagePct;
                categoriesWithCeilingCount++;
            }

            int changePct = 0;
            if (prevSpent.compareTo(BigDecimal.ZERO) > 0) {
                changePct = spent.subtract(prevSpent)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(prevSpent, 0, RoundingMode.HALF_UP)
                        .intValue();
            }

            costCenters.add(new CostCenterDto(
                    cat.getId(),
                    cat.getName(),
                    cat.getKind(),
                    cat.getColorToken(),
                    ceiling,
                    spent,
                    count,
                    usagePct,
                    changePct,
                    ContactDto.from(cat.getResponsibleContact())
            ));
        }

        int avgAdherence = categoriesWithCeilingCount > 0
                ? (int) Math.round((double) totalAdherenceSum / categoriesWithCeilingCount)
                : 0;

        String formula = "Gasto Consolidado = ∑(despesas das categorias no período); " +
                         "Uso do Teto = (gasto_real / teto_mensal) * 100; " +
                         "Aderência Média = média(uso_do_teto das categorias com teto definido); " +
                         "Variação (%) = ((gasto_atual - gasto_anterior) / gasto_anterior) * 100.";

        return new BudgetResponse(
                totalSpend,
                totalTransactions,
                avgAdherence,
                costCenters,
                formula
        );
    }

    public CostCenterDto updateCostCenter(Long categoryId, CostCenterUpdateRequest request, Long userId) {
        Category category = categoryRepository.findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Centro de Custo / Categoria", categoryId));

        Contact contact = category.getResponsibleContact();
        if (request.contact() != null && request.contact().name() != null && !request.contact().name().isBlank()) {
            if (contact != null) {
                contact.update(request.contact().name(), request.contact().email(), request.contact().phone());
            } else {
                User user = category.getUser();
                contact = new Contact(user, request.contact().name(), request.contact().email(), request.contact().phone());
                contact = contactRepository.save(contact);
            }
        }

        category.update(
                request.name(),
                request.colorToken(),
                request.monthlyCeiling(),
                request.kind(),
                contact
        );

        // Recalcula DTO atualizado
        List<Transaction> transactions = transactionRepository.findAllByUserIdOrderByDateDesc(userId);
        LocalDate start = LocalDate.now().with(TemporalAdjusters.firstDayOfMonth());
        LocalDate end = LocalDate.now().with(TemporalAdjusters.lastDayOfMonth());

        List<Transaction> catTxs = transactions.stream()
                .filter(t -> t.getCategory().getId().equals(categoryId) && t.getType() == TransactionType.EXPENSE)
                .filter(t -> !t.getDate().isBefore(start) && !t.getDate().isAfter(end))
                .toList();

        BigDecimal spent = catTxs.stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal ceiling = category.getMonthlyCeiling() != null ? category.getMonthlyCeiling() : BigDecimal.ZERO;
        int usagePct = (ceiling.compareTo(BigDecimal.ZERO) > 0)
                ? spent.multiply(BigDecimal.valueOf(100)).divide(ceiling, 0, RoundingMode.HALF_UP).intValue()
                : 0;

        return new CostCenterDto(
                category.getId(),
                category.getName(),
                category.getKind(),
                category.getColorToken(),
                ceiling,
                spent,
                (long) catTxs.size(),
                usagePct,
                0,
                ContactDto.from(contact)
        );
    }
}
