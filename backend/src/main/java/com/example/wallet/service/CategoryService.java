package com.example.wallet.service;

import com.example.wallet.dto.CategoryRequest;
import com.example.wallet.model.Category;
import com.example.wallet.model.User;
import com.example.wallet.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CategoryService {
    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public Category create(User owner, CategoryRequest req) {
        Category c = new Category();
        c.setName(req.getName());
        c.setOwner(owner);
        
        if (req.getParentId() != null) {
            categoryRepository.findById(req.getParentId()).ifPresent(c::setParent);
        }
        
        return categoryRepository.save(c);
    }

    public List<Category> listFor(User user) {
        return categoryRepository.findByOwnerIsNullOrOwner(user);
    }
    
    public List<Category> listMainCategories(User user) {
        return categoryRepository.findMainCategories(user);
    }
}
