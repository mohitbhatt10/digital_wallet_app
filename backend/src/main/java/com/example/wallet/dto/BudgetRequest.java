package com.example.wallet.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public class BudgetRequest {
    @Min(2000)
    private int year;
    @Min(1) @Max(12)
    private int month;
    @NotNull
    private BigDecimal amount;

    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }
    public int getMonth() { return month; }
    public void setMonth(int month) { this.month = month; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
}
