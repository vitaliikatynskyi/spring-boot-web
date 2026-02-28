package com.jarbudget.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ExpenseRequest(String title, String category, BigDecimal amount, LocalDate date) {
}
