package com.portfolio.finance.search;

import com.portfolio.finance.account.Account;
import com.portfolio.finance.account.AccountRepository;
import com.portfolio.finance.category.Category;
import com.portfolio.finance.category.CategoryRepository;
import com.portfolio.finance.search.dto.SearchResponseDto;
import com.portfolio.finance.search.dto.SearchResultItemDto;
import com.portfolio.finance.transaction.Transaction;
import com.portfolio.finance.transaction.TransactionRepository;
import com.portfolio.finance.transaction.TransactionType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class SearchService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;

    public SearchService(TransactionRepository transactionRepository,
                         AccountRepository accountRepository,
                         CategoryRepository categoryRepository) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.categoryRepository = categoryRepository;
    }

    public SearchResponseDto search(Long userId, String query) {
        if (query == null || query.trim().length() < 2) {
            return new SearchResponseDto(List.of(), 0, query != null ? query : "");
        }

        String q = query.trim();
        List<SearchResultItemDto> results = new ArrayList<>();

        // 1. Transactions (max 5)
        List<Transaction> transactions = transactionRepository.searchByKeyword(userId, q);
        for (Transaction t : transactions.stream().limit(5).toList()) {
            String typeLabel = t.getType() == TransactionType.INCOME ? "Receita" : "Despesa";
            String catName = t.getCategory() != null ? t.getCategory().getName() : "Sem Categoria";
            String subtitle = String.format("R$ %,.2f • %s • %s", t.getAmount(), t.getDate(), typeLabel);
            results.add(new SearchResultItemDto(
                    "tx-" + t.getId(),
                    t.getDescription(),
                    subtitle,
                    catName,
                    "Lançamento",
                    "deals"
            ));
        }

        // 2. Accounts / Suppliers (max 5)
        List<Account> accounts = accountRepository.searchByKeyword(userId, q);
        for (Account a : accounts.stream().limit(5).toList()) {
            String tierStr = a.getTier() != null ? a.getTier() : "Tier Padrão";
            String cityUf = (a.getCity() != null ? a.getCity() : "") +
                    (a.getUf() != null ? "/" + a.getUf() : "");
            String sub = tierStr + (cityUf.isBlank() ? "" : " • " + cityUf);
            results.add(new SearchResultItemDto(
                    "acc-" + a.getId(),
                    a.getName(),
                    sub,
                    a.getSegment() != null ? a.getSegment() : "Corporativo",
                    "Conta",
                    "customers"
            ));
        }

        // 3. Categories / Cost Centers (max 5)
        List<Category> categories = categoryRepository.searchByKeyword(userId, q);
        for (Category c : categories.stream().limit(5).toList()) {
            String ceilingStr = c.getMonthlyCeiling() != null
                    ? String.format("Teto R$ %,.2f", c.getMonthlyCeiling())
                    : "Sem teto definido";
            String kindStr = c.getKind() != null ? c.getKind() : "Operacional";
            results.add(new SearchResultItemDto(
                    "cat-" + c.getId(),
                    c.getName(),
                    ceilingStr + " • " + kindStr,
                    kindStr,
                    "Centro de Custo",
                    "pipeline"
            ));
        }

        return new SearchResponseDto(results, results.size(), q);
    }
}
