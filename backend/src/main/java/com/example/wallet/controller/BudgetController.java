package com.example.wallet.controller;

import com.example.wallet.dto.BudgetRequest;
import com.example.wallet.model.Budget;
import com.example.wallet.model.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    @PostMapping
    public ResponseEntity<Budget> upsert(@AuthenticationPrincipal User user, @Valid @RequestBody BudgetRequest req) {
        return ResponseEntity.ok(budgetService.upsert(user, req));
    }
}
