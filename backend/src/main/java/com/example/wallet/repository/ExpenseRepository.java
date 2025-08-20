package com.example.wallet.repository;

import com.example.wallet.model.Expense;
import com.example.wallet.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByUserAndDateBetween(User user, LocalDate start, LocalDate end);
}
