package com.example.wallet.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

public class ExpenseRequest {
    @NotNull
    private BigDecimal amount;
    private LocalDate date;
    private Long categoryId;
    private Set<Long> tagIds;
    private String description;

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public Set<Long> getTagIds() { return tagIds; }
    public void setTagIds(Set<Long> tagIds) { this.tagIds = tagIds; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
