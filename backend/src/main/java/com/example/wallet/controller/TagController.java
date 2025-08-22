package com.example.wallet.controller;

import com.example.wallet.dto.TagRequest;
import com.example.wallet.model.Tag;
import com.example.wallet.model.User;
import com.example.wallet.service.TagService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tags")
public class TagController {
    private final TagService tagService;

    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    @PostMapping
    public ResponseEntity<Tag> create(@AuthenticationPrincipal User user, @Valid @RequestBody TagRequest req) {
        return ResponseEntity.ok(tagService.create(user, req));
    }

    @GetMapping
    public ResponseEntity<List<Tag>> list(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(tagService.list(user));
    }
}
