package com.example.wallet.controller;

import com.example.wallet.dto.ExpenseRequest;
import com.example.wallet.model.Expense;
import com.example.wallet.model.User;
import com.example.wallet.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/expenses")
public class ExpenseController {
    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    // TODO: Replace with current authenticated user
    private User demoUser() { User u = new User(); u.setId(1L); u.setUsername("demo"); return u; }

    @PostMapping
    public ResponseEntity<Expense> create(@Valid @RequestBody ExpenseRequest req) {
        return ResponseEntity.ok(expenseService.create(demoUser(), req));
    }
}
