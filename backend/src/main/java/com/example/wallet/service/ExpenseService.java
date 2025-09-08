package com.example.wallet.service;

import com.example.wallet.dto.ExpenseRequest;
import com.example.wallet.dto.ExpenseResponse;
import com.example.wallet.model.*;
import com.example.wallet.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
public class ExpenseService {
    private final ExpenseRepository expenseRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;

    public ExpenseService(ExpenseRepository expenseRepository, CategoryRepository categoryRepository,
            TagRepository tagRepository) {
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
        // For now return last 20 by id desc (simple). Could be refined with date
        // filter.
        return expenseRepository.findAll().stream()
                .filter(e -> e.getUser().getId().equals(user.getId()))
                .sorted(Comparator.comparing(Expense::getId).reversed())
                .limit(20)
                .toList();
    }

    public Expense update(User user, Long id, ExpenseRequest req) {
        Optional<Expense> expenseOpt = expenseRepository.findById(id);
        if (expenseOpt.isEmpty()) {
            throw new IllegalArgumentException("Expense not found");
        }

        Expense expense = expenseOpt.get();
        if (!expense.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not authorized to update this expense");
        }

        expense.setAmount(req.getAmount());
        expense.setTransactionDate(
                req.getTransactionDate() != null ? req.getTransactionDate() : expense.getTransactionDate());
        expense.setDescription(req.getDescription());
        expense.setPaymentType(req.getPaymentType());

        if (req.getCategoryId() != null) {
            categoryRepository.findById(req.getCategoryId()).ifPresent(expense::setCategory);
        } else {
            expense.setCategory(null);
        }

        if (req.getTagIds() != null) {
            if (req.getTagIds().isEmpty()) {
                expense.setTags(new HashSet<>());
            } else {
                Set<Tag> tags = new HashSet<>(tagRepository.findAllById(req.getTagIds()));
                expense.setTags(tags);
            }
        }

        return expenseRepository.save(expense);
    }

    public void delete(User user, Long id) {
        Optional<Expense> expenseOpt = expenseRepository.findById(id);
        if (expenseOpt.isEmpty()) {
            throw new IllegalArgumentException("Expense not found");
        }

        Expense expense = expenseOpt.get();
        if (!expense.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not authorized to delete this expense");
        }

        expenseRepository.delete(expense);
    }

    public List<Expense> filter(User user, LocalDate startDate, LocalDate endDate, List<Long> categoryIds,
            List<Long> tagIds) {
        return filter(user, startDate, endDate, categoryIds, tagIds, 0, 10).getContent();
    }

    public Page<Expense> filter(User user, LocalDate startDate, LocalDate endDate, List<Long> categoryIds,
            List<Long> tagIds, int page, int size) {
        
        // Convert LocalDate to LocalDateTime for proper querying
        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = endDate != null ? endDate.atTime(LocalTime.MAX) : null;
        
        // Determine which filters are active
        boolean hasStartDate = startDateTime != null;
        boolean hasEndDate = endDateTime != null;
        boolean hasCategories = categoryIds != null && !categoryIds.isEmpty();
        boolean hasTags = tagIds != null && !tagIds.isEmpty();
        
        Pageable pageable = PageRequest.of(page, size);
        
        // Use the appropriate repository method based on active filters
        if (hasStartDate && hasEndDate) {
            // Both dates provided
            if (hasCategories && hasTags) {
                return expenseRepository.findByUserAndDateRangeAndCategoriesAndTags(
                    user, startDateTime, endDateTime, categoryIds, tagIds, pageable
                );
            } else if (hasCategories) {
                return expenseRepository.findByUserAndDateRangeAndCategories(
                    user, startDateTime, endDateTime, categoryIds, pageable
                );
            } else if (hasTags) {
                return expenseRepository.findByUserAndDateRangeAndTags(
                    user, startDateTime, endDateTime, tagIds, pageable
                );
            } else {
                return expenseRepository.findByUserAndDateRange(
                    user, startDateTime, endDateTime, pageable
                );
            }
        } else if (hasStartDate) {
            // Only start date provided
            if (hasCategories && hasTags) {
                return expenseRepository.findByUserAndStartDateAndCategoriesAndTags(
                    user, startDateTime, categoryIds, tagIds, pageable
                );
            } else if (hasCategories) {
                return expenseRepository.findByUserAndStartDateAndCategories(
                    user, startDateTime, categoryIds, pageable
                );
            } else if (hasTags) {
                return expenseRepository.findByUserAndStartDateAndTags(
                    user, startDateTime, tagIds, pageable
                );
            } else {
                return expenseRepository.findByUserAndStartDate(user, startDateTime, pageable);
            }
        } else if (hasEndDate) {
            // Only end date provided
            if (hasCategories && hasTags) {
                return expenseRepository.findByUserAndEndDateAndCategoriesAndTags(
                    user, endDateTime, categoryIds, tagIds, pageable
                );
            } else if (hasCategories) {
                return expenseRepository.findByUserAndEndDateAndCategories(
                    user, endDateTime, categoryIds, pageable
                );
            } else if (hasTags) {
                return expenseRepository.findByUserAndEndDateAndTags(
                    user, endDateTime, tagIds, pageable
                );
            } else {
                return expenseRepository.findByUserAndEndDate(user, endDateTime, pageable);
            }
        } else {
            // No date filters
            if (hasCategories && hasTags) {
                return expenseRepository.findByUserAndCategoriesAndTags(
                    user, categoryIds, tagIds, pageable
                );
            } else if (hasCategories) {
                return expenseRepository.findByUserAndCategories(
                    user, categoryIds, pageable
                );
            } else if (hasTags) {
                return expenseRepository.findByUserAndTags(
                    user, tagIds, pageable
                );
            } else {
                return expenseRepository.findByUserOnly(user, pageable);
            }
        }
    }

    public ExpenseResponse toResponse(Expense e) {
        ExpenseResponse r = new ExpenseResponse();
        r.setId(e.getId());
        r.setAmount(e.getAmount());
        r.setTransactionDate(e.getTransactionDate());
        r.setDescription(e.getDescription());
        r.setPaymentType(e.getPaymentType());
        if (e.getCategory() != null) {
            Long parentId = e.getCategory().getParent() != null ? e.getCategory().getParent().getId() : null;
            String parentName = e.getCategory().getParent() != null ? e.getCategory().getParent().getName() : null;
            r.setCategory(new ExpenseResponse.CategoryRef(
                    e.getCategory().getId(),
                    e.getCategory().getName(),
                    parentId,
                    parentName));
        }
        if (e.getTags() != null && !e.getTags().isEmpty()) {
            r.setTags(e.getTags().stream().map(t -> new ExpenseResponse.TagRef(t.getId(), t.getName())).toList());
        }
        return r;
    }
}
