package com.example.wallet.dto;

import jakarta.validation.constraints.NotBlank;

public class TagRequest {
    @NotBlank
    private String name;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
