package com.jarbudget.backend.dto;

import java.math.BigDecimal;
import java.util.Map;

public record SummaryResponse(BigDecimal totalAmount, int count, Map<String, BigDecimal> byCategory) {
}
