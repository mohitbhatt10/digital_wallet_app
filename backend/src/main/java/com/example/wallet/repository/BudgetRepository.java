package com.example.wallet.repository;

import com.example.wallet.model.Budget;
import com.example.wallet.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BudgetRepository extends JpaRepository<Budget, Long> {
    Optional<Budget> findByUserAndYearAndMonth(User user, int year, int month);
}
