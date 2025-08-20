package com.example.wallet.controller;

import com.example.wallet.dto.CategoryRequest;
import com.example.wallet.model.Category;
import com.example.wallet.model.User;
import com.example.wallet.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/categories")
public class CategoryController {
    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    // TODO: Replace with current authenticated user
    private User demoUser() { User u = new User(); u.setId(1L); u.setUsername("demo"); return u; }

    @PostMapping
    public ResponseEntity<Category> create(@Valid @RequestBody CategoryRequest req) {
        return ResponseEntity.ok(categoryService.create(demoUser(), req));
    }

    @GetMapping
    public ResponseEntity<List<Category>> list() {
        return ResponseEntity.ok(categoryService.listFor(demoUser()));
    }
}
