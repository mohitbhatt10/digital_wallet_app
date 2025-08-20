package com.example.wallet.service;

import com.example.wallet.dto.ExpenseRequest;
import com.example.wallet.model.*;
import com.example.wallet.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
public class ExpenseService {
    private final ExpenseRepository expenseRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;

    public ExpenseService(ExpenseRepository expenseRepository, CategoryRepository categoryRepository, TagRepository tagRepository) {
        this.expenseRepository = expenseRepository;
        this.categoryRepository = categoryRepository;
        this.tagRepository = tagRepository;
    }

    public Expense create(User user, ExpenseRequest req) {
        Expense e = new Expense();
        e.setUser(user);
        e.setAmount(req.getAmount());
        e.setDate(req.getDate() != null ? req.getDate() : LocalDate.now());
        e.setDescription(req.getDescription());
        if (req.getCategoryId() != null) {
            categoryRepository.findById(req.getCategoryId()).ifPresent(e::setCategory);
        }
        if (req.getTagIds() != null && !req.getTagIds().isEmpty()) {
            Set<Tag> tags = new HashSet<>(tagRepository.findAllById(req.getTagIds()));
            e.setTags(tags);
        }
        return expenseRepository.save(e);
    }
}
