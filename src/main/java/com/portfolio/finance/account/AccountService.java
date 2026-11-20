package com.portfolio.finance.account;

import com.portfolio.finance.account.dto.AccountBreakdownDto;
import com.portfolio.finance.account.dto.AccountRequest;
import com.portfolio.finance.account.dto.AccountResponse;
import com.portfolio.finance.account.dto.AccountSummaryResponse;
import com.portfolio.finance.account.dto.AppointmentRequest;
import com.portfolio.finance.account.dto.AppointmentResponse;
import com.portfolio.finance.account.dto.ContactDto;
import com.portfolio.finance.account.dto.ContactRequest;
import com.portfolio.finance.exception.ResourceNotFoundException;
import com.portfolio.finance.transaction.ReferencePeriodResolver;
import com.portfolio.finance.transaction.Transaction;
import com.portfolio.finance.transaction.TransactionRepository;
import com.portfolio.finance.transaction.TransactionType;
import com.portfolio.finance.user.User;
import com.portfolio.finance.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class AccountService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final AccountRepository accountRepository;
    private final ContactRepository contactRepository;
    private final AppointmentRepository appointmentRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final ReferencePeriodResolver referencePeriodResolver;

    @Autowired
    public AccountService(AccountRepository accountRepository,
                          ContactRepository contactRepository,
                          AppointmentRepository appointmentRepository,
                          TransactionRepository transactionRepository,
                          UserRepository userRepository,
                          ReferencePeriodResolver referencePeriodResolver) {
        this.accountRepository = accountRepository;
        this.contactRepository = contactRepository;
        this.appointmentRepository = appointmentRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.referencePeriodResolver = referencePeriodResolver;
    }

    public AccountService(AccountRepository accountRepository,
                          ContactRepository contactRepository,
                          AppointmentRepository appointmentRepository,
                          TransactionRepository transactionRepository,
                          UserRepository userRepository) {
        this(accountRepository, contactRepository, appointmentRepository,
                transactionRepository, userRepository,
                new ReferencePeriodResolver(transactionRepository));
    }

    /**
     * Calcula de forma determinística o índice de regularidade de uma conta (0 a 100%)
     * baseado exclusivamente no período de referência (sem {@code LocalDate.now()}):
     * percentual dos últimos 6 meses (terminando no período de referência, isto é,
     * {@code [referencePeriod - 5 meses, referencePeriod]}) em que a conta teve ao menos um lançamento.
     * <pre>
     * regularidadePorConta = round((mesesComLancamentoNosUltimos6Meses / 6.0) * 100)
     * indiceGeralResumo    = round(soma(regularidadePorConta) / totalContasAtivas)
     * </pre>
     *
     * @param accountTransactions lançamentos vinculados à conta
     * @param referencePeriod     período de referência (ano, mês)
     * @return percentual arredondado entre 0 e 100
     */
    public int calculateAccountRegularity(List<Transaction> accountTransactions, YearMonth referencePeriod) {
        if (accountTransactions == null || accountTransactions.isEmpty() || referencePeriod == null) {
            return 0;
        }
        YearMonth startMonth = referencePeriod.minusMonths(5);
        long activeMonths = accountTransactions.stream()
                .map(Transaction::getDate)
                .filter(d -> d != null)
                .map(YearMonth::from)
                .filter(ym -> !ym.isBefore(startMonth) && !ym.isAfter(referencePeriod))
                .distinct()
                .count();
        return (int) Math.round((activeMonths * 100.0) / 6.0);
    }

    @Transactional(readOnly = true)
    public List<AccountResponse> listAccounts(Long userId, String tier, String q, boolean includeArchived) {
        List<Account> accounts = includeArchived
                ? accountRepository.findAllByUserIdOrderByIdAsc(userId)
                : accountRepository.findAllByUserIdAndArchivedAtIsNullOrderByIdAsc(userId);

        if (tier != null && !tier.isBlank()) {
            accounts = accounts.stream()
                    .filter(a -> tier.equalsIgnoreCase(a.getTier()))
                    .toList();
        }

        if (q != null && !q.isBlank()) {
            String queryLower = q.trim().toLowerCase();
            accounts = accounts.stream()
                    .filter(a -> (a.getName() != null && a.getName().toLowerCase().contains(queryLower)) ||
                                 (a.getSegment() != null && a.getSegment().toLowerCase().contains(queryLower)) ||
                                 (a.getCity() != null && a.getCity().toLowerCase().contains(queryLower)) ||
                                 (a.getPrimaryContact() != null && a.getPrimaryContact().getName() != null &&
                                  a.getPrimaryContact().getName().toLowerCase().contains(queryLower)))
                    .toList();
        }

        List<Transaction> transactions = transactionRepository.findAllByUserIdOrderByDateDesc(userId);
        Map<Long, List<Transaction>> txByAccount = transactions.stream()
                .filter(t -> t.getAccount() != null)
                .collect(Collectors.groupingBy(t -> t.getAccount().getId()));

        YearMonth refPeriod = referencePeriodResolver.resolve(userId);

        return accounts.stream().map(acc -> {
            List<Transaction> accTxs = txByAccount.getOrDefault(acc.getId(), List.of());
            BigDecimal movement = accTxs.stream()
                    .map(Transaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            long txCount = accTxs.size();

            String lastOpDate = accTxs.isEmpty()
                    ? "Sem operações"
                    : accTxs.get(0).getDate().format(DATE_FMT);
            int regularityPct = calculateAccountRegularity(accTxs, refPeriod);

            return AccountResponse.from(acc, movement, txCount, lastOpDate, regularityPct);
        }).toList();
    }

    @Transactional(readOnly = true)
    public AccountResponse getAccount(Long accountId, Long userId) {
        Account acc = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Conta", accountId));

        List<Transaction> accTxs = transactionRepository.findByAccountIdAndUserIdOrderByDateDesc(accountId, userId);
        BigDecimal movement = accTxs.stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long txCount = accTxs.size();

        YearMonth refPeriod = referencePeriodResolver.resolve(userId);
        String lastOpDate = accTxs.isEmpty() ? "Sem operações" : accTxs.get(0).getDate().format(DATE_FMT);
        int regularityPct = calculateAccountRegularity(accTxs, refPeriod);

        return AccountResponse.from(acc, movement, txCount, lastOpDate, regularityPct);
    }

    public AccountResponse createAccount(AccountRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", userId));

        Contact contact = null;
        if (request.contact() != null && request.contact().name() != null && !request.contact().name().isBlank()) {
            contact = new Contact(user, request.contact().name().trim(), request.contact().email(), request.contact().phone());
            contact = contactRepository.save(contact);
        }

        Account account = new Account(
                user,
                request.name().trim(),
                request.segment(),
                request.tier(),
                request.city(),
                request.uf(),
                request.openingBalance(),
                contact
        );

        account = accountRepository.save(account);
        YearMonth refPeriod = referencePeriodResolver.resolve(userId);
        return AccountResponse.from(account, BigDecimal.ZERO, 0L, "Sem operações", calculateAccountRegularity(List.of(), refPeriod));
    }

    public AccountResponse updateAccount(Long accountId, AccountRequest request, Long userId) {
        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Conta", accountId));

        Contact contact = account.getPrimaryContact();
        if (request.contact() != null && request.contact().name() != null && !request.contact().name().isBlank()) {
            if (contact != null) {
                contact.update(request.contact().name(), request.contact().email(), request.contact().phone());
            } else {
                User user = account.getUser();
                contact = new Contact(user, request.contact().name(), request.contact().email(), request.contact().phone());
                contact = contactRepository.save(contact);
            }
        }

        account.update(
                request.name(),
                request.segment(),
                request.tier(),
                request.city(),
                request.uf(),
                request.openingBalance(),
                contact
        );

        return getAccount(accountId, userId);
    }

    public void archiveAccount(Long accountId, Long userId) {
        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Conta", accountId));
        account.archive();
    }

    /**
     * Resumo consolidado das contas ativas do usuário.
     * O {@code regularityIndex} geral é a média arredondada dos índices de regularidade individuais
     * de cada conta ativa, calculados por {@link #calculateAccountRegularity(List, YearMonth)}
     * (percentual dos últimos 6 meses encerrados no período de referência com ao menos um lançamento).
     */
    @Transactional(readOnly = true)
    public AccountSummaryResponse getSummary(Long userId, LocalDate startDate, LocalDate endDate) {
        List<Account> accounts = accountRepository.findAllByUserIdAndArchivedAtIsNullOrderByIdAsc(userId);
        List<Transaction> transactions = transactionRepository.findAllByUserIdOrderByDateDesc(userId);

        YearMonth refPeriod;
        if (endDate != null) {
            refPeriod = YearMonth.from(endDate);
        } else if (startDate != null) {
            refPeriod = YearMonth.from(startDate);
        } else {
            refPeriod = referencePeriodResolver.resolve(userId);
        }

        Map<Long, List<Transaction>> allTxByAccount = transactions.stream()
                .filter(t -> t.getAccount() != null)
                .collect(Collectors.groupingBy(t -> t.getAccount().getId()));

        Map<Long, List<Transaction>> txByAccount = transactions.stream()
                .filter(t -> t.getAccount() != null)
                .filter(t -> (startDate == null || !t.getDate().isBefore(startDate)) &&
                             (endDate == null || !t.getDate().isAfter(endDate)))
                .collect(Collectors.groupingBy(t -> t.getAccount().getId()));

        long totalAccounts = accounts.size();
        long activeTransactions = 0;
        BigDecimal accumulatedBalance = BigDecimal.ZERO;
        List<AccountBreakdownDto> breakdown = new ArrayList<>();
        int totalRegularity = 0;

        for (Account acc : accounts) {
            List<Transaction> accTxs = txByAccount.getOrDefault(acc.getId(), List.of());
            List<Transaction> allAccTxs = allTxByAccount.getOrDefault(acc.getId(), List.of());
            activeTransactions += accTxs.size();

            // Saldo líquido das transações desta conta: receitas - despesas
            BigDecimal txNet = accTxs.stream()
                    .map(t -> t.getType() == TransactionType.INCOME ? t.getAmount() : t.getAmount().negate())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal accTotalBalance = acc.getOpeningBalance().add(txNet);
            accumulatedBalance = accumulatedBalance.add(accTotalBalance);

            int reg = calculateAccountRegularity(allAccTxs, refPeriod);
            totalRegularity += reg;

            breakdown.add(new AccountBreakdownDto(
                    acc.getId(),
                    acc.getName(),
                    accTotalBalance,
                    (long) accTxs.size()
            ));
        }

        int avgRegularity = totalAccounts > 0 ? (int) Math.round((double) totalRegularity / totalAccounts) : 0;

        String formula = "Total de Contas = contagem de contas ativas cadastradas; " +
                         "Saldo Acumulado = ∑(saldo_inicial + receitas - despesas); " +
                         "Índice de Regularidade = média arredondada da regularidade por conta (% dos últimos 6 meses encerrados no período de referência com ao menos 1 lançamento); " +
                         "Lançamentos Ativos = ∑(lançamentos vinculados às contas no período).";

        return new AccountSummaryResponse(
                totalAccounts,
                accumulatedBalance,
                avgRegularity,
                activeTransactions,
                breakdown,
                formula
        );
    }

    public ContactDto updateContact(Long contactId, ContactRequest request, Long userId) {
        Contact contact = contactRepository.findByIdAndUserId(contactId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Contato", contactId));
        contact.update(request.name(), request.email(), request.phone());
        return ContactDto.from(contact);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> listAppointments(Long accountId, Long userId) {
        accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Conta", accountId));
        return appointmentRepository.findByAccountIdAndUserIdOrderByScheduledAtAsc(accountId, userId)
                .stream()
                .map(AppointmentResponse::from)
                .toList();
    }

    public AppointmentResponse createAppointment(Long accountId, AppointmentRequest request, Long userId) {
        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Conta", accountId));
        User user = account.getUser();

        Appointment appt = new Appointment(user, account, request.title(), request.scheduledAt(), request.note());
        appt = appointmentRepository.save(appt);
        return AppointmentResponse.from(appt);
    }

    public AppointmentResponse updateAppointment(Long accountId, Long apptId, AppointmentRequest request, Long userId) {
        accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Conta", accountId));

        Appointment appt = appointmentRepository.findByIdAndUserId(apptId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Compromisso", apptId));

        appt.update(request.title(), request.scheduledAt(), request.note());
        return AppointmentResponse.from(appt);
    }

    public void deleteAppointment(Long accountId, Long apptId, Long userId) {
        accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Conta", accountId));

        Appointment appt = appointmentRepository.findByIdAndUserId(apptId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Compromisso", apptId));

        appointmentRepository.delete(appt);
    }
}
