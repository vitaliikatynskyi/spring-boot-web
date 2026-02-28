package com.jarbudget.backend.service;

import com.jarbudget.backend.dto.ExpenseRequest;
import com.jarbudget.backend.dto.SummaryResponse;
import com.jarbudget.backend.model.Expense;
import com.jarbudget.backend.repository.ExpenseRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ExpenseService {

    private final ExpenseRepository repository;

    public ExpenseService(ExpenseRepository repository) {
        this.repository = repository;
    }

    public Expense addExpense(ExpenseRequest request) {
        var date = request.date() != null ? request.date() : LocalDate.now();
        var expense = new Expense(
                safeTrim(request.title()),
                safeTrim(request.category()),
                request.amount() != null ? request.amount() : BigDecimal.ZERO,
                date
        );
        return repository.save(expense);
    }

    public List<Expense> findAll() {
        return repository.findAll();
    }

    public boolean delete(long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return true;
        }
        return false;
    }

    public SummaryResponse summary() {
        var expenses = repository.findAll();
        var byCategory = expenses.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getCategory() == null || e.getCategory().isBlank() ? "Uncategorized" : e.getCategory(),
                        Collectors.reducing(BigDecimal.ZERO, Expense::getAmount, BigDecimal::add)
                ));
        var total = expenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new SummaryResponse(total, expenses.size(), byCategory);
    }

    private String safeTrim(String value) {
        return value == null ? null : value.trim();
    }
}
