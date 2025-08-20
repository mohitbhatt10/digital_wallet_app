package com.example.wallet.controller;

import com.example.wallet.dto.ExpenseRequest;
import com.example.wallet.model.Expense;
import com.example.wallet.model.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    @PostMapping
    public ResponseEntity<Expense> create(@AuthenticationPrincipal User user, @Valid @RequestBody ExpenseRequest req) {
        return ResponseEntity.ok(expenseService.create(user, req));
    }
}
