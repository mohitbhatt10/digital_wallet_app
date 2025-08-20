package com.example.wallet.controller;

import com.example.wallet.dto.CategoryRequest;
import com.example.wallet.model.Category;
import com.example.wallet.model.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    @PostMapping
    public ResponseEntity<Category> create(@AuthenticationPrincipal User user, @Valid @RequestBody CategoryRequest req) {
        return ResponseEntity.ok(categoryService.create(user, req));
    }

    @GetMapping
    public ResponseEntity<List<Category>> list(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(categoryService.listFor(user));
    }
}
