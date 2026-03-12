package com.jarbudget.backend.service;

import com.jarbudget.backend.dto.ExpenseRequest;
import com.jarbudget.backend.model.Expense;
import com.jarbudget.backend.repository.ExpenseRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {

    @Mock
    private ExpenseRepository repository;

    @InjectMocks
    private ExpenseService service;
    @Test
    void addExpenseUsesTodayWhenDateMissing() {
        when(repository.save(any(Expense.class))).thenAnswer(invocation -> invocation.getArgument(0));
        var request = new ExpenseRequest("Lunch", "Food", new BigDecimal("12.30"), null);
        var today = LocalDate.now();

        Expense saved = service.addExpense(request);

        assertThat(saved.getDate()).isEqualTo(today);
    }

    @Test
    void addExpenseTrimsStrings() {
        when(repository.save(any(Expense.class))).thenAnswer(invocation -> invocation.getArgument(0));
        var request = new ExpenseRequest("  Taxi  ", "  Transport  ", new BigDecimal("100"), LocalDate.of(2024, 2, 1));

        service.addExpense(request);

        ArgumentCaptor<Expense> captor = ArgumentCaptor.forClass(Expense.class);
        verify(repository).save(captor.capture());
        Expense saved = captor.getValue();

        assertThat(saved.getTitle()).isEqualTo("Taxi");
        assertThat(saved.getCategory()).isEqualTo("Transport");
    }

    @Test
    void addExpenseDefaultsAmountToZeroWhenMissing() {
        when(repository.save(any(Expense.class))).thenAnswer(invocation -> invocation.getArgument(0));
        var request = new ExpenseRequest("Notebook", null, null, LocalDate.of(2024, 5, 10));

        Expense saved = service.addExpense(request);

        assertThat(saved.getAmount()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void deleteRemovesRecordWhenPresent() {
        when(repository.existsById(5L)).thenReturn(true);

        boolean deleted = service.delete(5L);

        assertThat(deleted).isTrue();
        verify(repository).deleteById(5L);
    }

    @Test
    void deleteReturnsFalseWhenMissing() {
        when(repository.existsById(7L)).thenReturn(false);

        boolean deleted = service.delete(7L);

        assertThat(deleted).isFalse();
        verify(repository, never()).deleteById(anyLong());
    }

    @Test
    void summarySumsAmountsAndGroupsByCategory() {
        var expenses = List.of(
                new Expense("Coffee", "Food", new BigDecimal("3.50"), LocalDate.of(2024, 1, 1)),
                new Expense("Sandwich", "Food", new BigDecimal("5.00"), LocalDate.of(2024, 1, 2)),
                new Expense("Bus", "Transport", new BigDecimal("2.40"), LocalDate.of(2024, 1, 3))
        );
        when(repository.findAll()).thenReturn(expenses);

        var summary = service.summary();

        assertThat(summary.totalAmount()).isEqualByComparingTo(new BigDecimal("10.90"));
        assertThat(summary.count()).isEqualTo(3);
        assertThat(summary.byCategory())
                .containsEntry("Food", new BigDecimal("8.50"))
                .containsEntry("Transport", new BigDecimal("2.40"));
    }

    @Test
    void summaryPutsBlankCategoryIntoUncategorized() {
        var expenses = List.of(
                new Expense("Tea", "", new BigDecimal("2.00"), LocalDate.of(2024, 1, 4)),
                new Expense("Water", null, new BigDecimal("1.00"), LocalDate.of(2024, 1, 5))
        );
        when(repository.findAll()).thenReturn(expenses);

        var summary = service.summary();

        assertThat(summary.byCategory())
                .containsEntry("Uncategorized", new BigDecimal("3.00"));
    }
}
