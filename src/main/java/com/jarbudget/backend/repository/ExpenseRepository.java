package com.jarbudget.backend.repository;

import com.jarbudget.backend.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
}
