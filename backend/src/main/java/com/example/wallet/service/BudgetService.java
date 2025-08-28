package com.example.wallet.service;

import com.example.wallet.dto.BudgetRequest;
import com.example.wallet.model.Budget;
import com.example.wallet.model.User;
import com.example.wallet.repository.BudgetRepository;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class BudgetService {
    private final BudgetRepository budgetRepository;

    public BudgetService(BudgetRepository budgetRepository) {
        this.budgetRepository = budgetRepository;
    }

    public Budget upsert(User user, BudgetRequest req) {
        Optional<Budget> existing = budgetRepository.findByUserAndYearAndMonth(user, req.getYear(), req.getMonth());
        Budget b = existing.orElseGet(Budget::new);
        b.setUser(user);
        b.setYear(req.getYear());
        b.setMonth(req.getMonth());
        b.setAmount(req.getAmount());
        return budgetRepository.save(b);
    }

    public Budget  findByUserAndYearAndMonth(User user, int year, int month) {
        return budgetRepository.findByUserAndYearAndMonth(user, year, month).orElse(null);
    }
}
