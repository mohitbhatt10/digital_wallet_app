package com.example.wallet.repository;

import com.example.wallet.model.Category;
import com.example.wallet.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByOwnerIsNullOrOwner(User owner);
}
