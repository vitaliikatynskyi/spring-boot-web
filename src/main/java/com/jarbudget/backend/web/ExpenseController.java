package com.jarbudget.backend.web;

import com.jarbudget.backend.dto.ExpenseRequest;
import com.jarbudget.backend.dto.SummaryResponse;
import com.jarbudget.backend.model.Expense;
import com.jarbudget.backend.service.ExpenseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService service;

    public ExpenseController(ExpenseService service) {
        this.service = service;
    }

    @GetMapping
    public List<Expense> all() {
        return service.findAll();
    }

    @PostMapping
    public ResponseEntity<Expense> add(@RequestBody ExpenseRequest request) {
        var created = service.addExpense(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        return service.delete(id) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @GetMapping("/summary")
    public SummaryResponse summary() {
        return service.summary();
    }
}
