package com.example.wallet.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class ExpenseResponse {
    public record CategoryRef(Long id, String name) {}
    public record TagRef(Long id, String name) {}

    private Long id;
    private BigDecimal amount;
    private LocalDate date;
    private String description;
    private CategoryRef category;
    private List<TagRef> tags;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public CategoryRef getCategory() { return category; }
    public void setCategory(CategoryRef category) { this.category = category; }
    public List<TagRef> getTags() { return tags; }
    public void setTags(List<TagRef> tags) { this.tags = tags; }
}
