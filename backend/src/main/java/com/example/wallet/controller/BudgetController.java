package com.example.wallet.controller;

import com.example.wallet.dto.BudgetRequest;
import com.example.wallet.model.Budget;
import com.example.wallet.model.User;
import com.example.wallet.service.BudgetService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/budgets")
public class BudgetController {
    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    // TODO: Replace with current authenticated user
    private User demoUser() { User u = new User(); u.setId(1L); u.setUsername("demo"); return u; }

    @PostMapping
    public ResponseEntity<Budget> upsert(@Valid @RequestBody BudgetRequest req) {
        return ResponseEntity.ok(budgetService.upsert(demoUser(), req));
    }
}
