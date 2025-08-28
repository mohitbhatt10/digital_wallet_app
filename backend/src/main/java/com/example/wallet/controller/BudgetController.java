package com.example.wallet.controller;

import com.example.wallet.dto.BudgetRequest;
import com.example.wallet.model.Budget;
import com.example.wallet.model.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.example.wallet.service.BudgetService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;

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

    @GetMapping("/current")
    public ResponseEntity<Budget> getCurrentMonthBudget(@AuthenticationPrincipal User user) {
        LocalDate now = LocalDate.now();
        Budget budget = budgetService.findByUserAndYearAndMonth(user, now.getYear(), now.getMonthValue());
        if (budget == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(budget);
    }

    @GetMapping
    public ResponseEntity<Budget> getBudgetByMonthYear(@AuthenticationPrincipal User user,
            @RequestParam int year,
            @RequestParam int month) {
        Budget budget = budgetService.findByUserAndYearAndMonth(user, year, month);
        if (budget == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(budget);
    }
}
