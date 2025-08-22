package com.example.wallet.service;

import com.example.wallet.dto.ExpenseRequest;
import com.example.wallet.dto.ExpenseResponse;
import com.example.wallet.model.*;
import com.example.wallet.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
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
        e.setTransactionDate(req.getTransactionDate() != null ? req.getTransactionDate() : LocalDateTime.now());
        e.setDescription(req.getDescription());
        e.setPaymentType(req.getPaymentType());
        if (req.getCategoryId() != null) {
            categoryRepository.findById(req.getCategoryId()).ifPresent(e::setCategory);
        }
        if (req.getTagIds() != null && !req.getTagIds().isEmpty()) {
            Set<Tag> tags = new HashSet<>(tagRepository.findAllById(req.getTagIds()));
            e.setTags(tags);
        }
        return expenseRepository.save(e);
    }

    public List<Expense> listRecent(User user) {
        // For now return last 20 by id desc (simple). Could be refined with date filter.
        return expenseRepository.findAll().stream()
                .filter(e -> e.getUser().getId().equals(user.getId()))
                .sorted(Comparator.comparing(Expense::getId).reversed())
                .limit(20)
                .toList();
    }

    public ExpenseResponse toResponse(Expense e) {
        ExpenseResponse r = new ExpenseResponse();
        r.setId(e.getId());
        r.setAmount(e.getAmount());
        r.setTransactionDate(e.getTransactionDate());
        r.setDescription(e.getDescription());
        r.setPaymentType(e.getPaymentType());
        if (e.getCategory() != null) {
            r.setCategory(new ExpenseResponse.CategoryRef(e.getCategory().getId(), e.getCategory().getName()));
        }
        if (e.getTags() != null && !e.getTags().isEmpty()) {
            r.setTags(e.getTags().stream().map(t -> new ExpenseResponse.TagRef(t.getId(), t.getName())).toList());
        }
        return r;
    }
}
