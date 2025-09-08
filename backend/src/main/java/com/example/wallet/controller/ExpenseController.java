package com.example.wallet.controller;

import com.example.wallet.dto.ExpenseRequest;
import com.example.wallet.dto.ExpenseResponse;
import com.example.wallet.model.Expense;
import com.example.wallet.model.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.example.wallet.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/expenses")
public class ExpenseController {
    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @PostMapping
    public ResponseEntity<ExpenseResponse> create(@AuthenticationPrincipal User user,
            @Valid @RequestBody ExpenseRequest req) {
        Expense created = expenseService.create(user, req);
        return ResponseEntity.ok(expenseService.toResponse(created));
    }

    @GetMapping
    public ResponseEntity<List<ExpenseResponse>> listRecent(@AuthenticationPrincipal User user) {
        List<ExpenseResponse> list = expenseService.listRecent(user).stream().map(expenseService::toResponse).toList();
        return ResponseEntity.ok(list);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExpenseResponse> update(@AuthenticationPrincipal User user, @PathVariable Long id,
            @Valid @RequestBody ExpenseRequest req) {
        Expense updated = expenseService.update(user, id, req);
        return ResponseEntity.ok(expenseService.toResponse(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        expenseService.delete(user, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/filter")
    public ResponseEntity<List<ExpenseResponse>> filter(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) List<Long> categoryIds,
            @RequestParam(required = false) List<Long> tagIds) {
        List<ExpenseResponse> filtered = expenseService.filter(user, startDate, endDate, categoryIds, tagIds)
                .stream().map(expenseService::toResponse).toList();
        return ResponseEntity.ok(filtered);
    }
}
