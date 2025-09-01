package com.example.wallet.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class ExpenseResponse {
    public record CategoryRef(Long id, String name, Long parentId, String parentName) {
    }

    public record TagRef(Long id, String name) {
    }

    private Long id;
    private BigDecimal amount;
    private LocalDateTime transactionDate;
    private String description;
    private String paymentType;
    private CategoryRef category;
    private List<TagRef> tags;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public LocalDateTime getTransactionDate() {
        return transactionDate;
    }

    public void setTransactionDate(LocalDateTime transactionDate) {
        this.transactionDate = transactionDate;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPaymentType() {
        return paymentType;
    }

    public void setPaymentType(String paymentType) {
        this.paymentType = paymentType;
    }

    public CategoryRef getCategory() {
        return category;
    }

    public void setCategory(CategoryRef category) {
        this.category = category;
    }

    public List<TagRef> getTags() {
        return tags;
    }

    public void setTags(List<TagRef> tags) {
        this.tags = tags;
    }
}
