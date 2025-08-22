package com.example.wallet.repository;

import com.example.wallet.model.Category;
import com.example.wallet.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByOwnerIsNullOrOwner(User owner);
    List<Category> findByOwnerIsNull(); // System categories only
    
    @Query("SELECT c FROM Category c WHERE c.parent IS NULL AND (c.owner IS NULL OR c.owner = :user)")
    List<Category> findMainCategories(@Param("user") User user);
}
