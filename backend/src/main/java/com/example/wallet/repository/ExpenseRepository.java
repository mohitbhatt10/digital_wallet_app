package com.example.wallet.repository;

import com.example.wallet.model.Expense;
import com.example.wallet.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    
    List<Expense> findByUserAndTransactionDateBetween(User user, LocalDateTime start, LocalDateTime end);
    
    // Query without any filters except user
    @Query("SELECT DISTINCT e FROM Expense e " +
           "WHERE e.user = :user " +
           "ORDER BY e.transactionDate DESC")
    Page<Expense> findByUserOnly(
        @Param("user") User user,
        Pageable pageable
    );
    
    // Query with date range only
    @Query("SELECT DISTINCT e FROM Expense e " +
           "WHERE e.user = :user " +
           "AND e.transactionDate >= :startDate " +
           "AND e.transactionDate <= :endDate " +
           "ORDER BY e.transactionDate DESC")
    Page<Expense> findByUserAndDateRange(
        @Param("user") User user,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        Pageable pageable
    );
    
    // Query with start date only
    @Query("SELECT DISTINCT e FROM Expense e " +
           "WHERE e.user = :user " +
           "AND e.transactionDate >= :startDate " +
           "ORDER BY e.transactionDate DESC")
    Page<Expense> findByUserAndStartDate(
        @Param("user") User user,
        @Param("startDate") LocalDateTime startDate,
        Pageable pageable
    );
    
    // Query with end date only
    @Query("SELECT DISTINCT e FROM Expense e " +
           "WHERE e.user = :user " +
           "AND e.transactionDate <= :endDate " +
           "ORDER BY e.transactionDate DESC")
    Page<Expense> findByUserAndEndDate(
        @Param("user") User user,
        @Param("endDate") LocalDateTime endDate,
        Pageable pageable
    );
    
    // Category filters
    @Query("SELECT DISTINCT e FROM Expense e " +
           "WHERE e.user = :user " +
           "AND e.category.id IN :categoryIds " +
           "ORDER BY e.transactionDate DESC")
    Page<Expense> findByUserAndCategories(
        @Param("user") User user,
        @Param("categoryIds") List<Long> categoryIds,
        Pageable pageable
    );
    
    @Query("SELECT DISTINCT e FROM Expense e " +
           "WHERE e.user = :user " +
           "AND e.transactionDate >= :startDate " +
           "AND e.transactionDate <= :endDate " +
           "AND e.category.id IN :categoryIds " +
           "ORDER BY e.transactionDate DESC")
    Page<Expense> findByUserAndDateRangeAndCategories(
        @Param("user") User user,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        @Param("categoryIds") List<Long> categoryIds,
        Pageable pageable
    );
    
    // Tag filters
    @Query("SELECT DISTINCT e FROM Expense e " +
           "LEFT JOIN e.tags t " +
           "WHERE e.user = :user " +
           "AND t.id IN :tagIds " +
           "ORDER BY e.transactionDate DESC")
    Page<Expense> findByUserAndTags(
        @Param("user") User user,
        @Param("tagIds") List<Long> tagIds,
        Pageable pageable
    );
    
    @Query("SELECT DISTINCT e FROM Expense e " +
           "LEFT JOIN e.tags t " +
           "WHERE e.user = :user " +
           "AND e.transactionDate >= :startDate " +
           "AND e.transactionDate <= :endDate " +
           "AND t.id IN :tagIds " +
           "ORDER BY e.transactionDate DESC")
    Page<Expense> findByUserAndDateRangeAndTags(
        @Param("user") User user,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        @Param("tagIds") List<Long> tagIds,
        Pageable pageable
    );
    
    @Query("SELECT DISTINCT e FROM Expense e " +
           "WHERE e.user = :user " +
           "AND e.transactionDate >= :startDate " +
           "AND e.category.id IN :categoryIds " +
           "ORDER BY e.transactionDate DESC")
    Page<Expense> findByUserAndStartDateAndCategories(
        @Param("user") User user,
        @Param("startDate") LocalDateTime startDate,
        @Param("categoryIds") List<Long> categoryIds,
        Pageable pageable
    );
    
    @Query("SELECT DISTINCT e FROM Expense e " +
           "LEFT JOIN e.tags t " +
           "WHERE e.user = :user " +
           "AND e.transactionDate >= :startDate " +
           "AND t.id IN :tagIds " +
           "ORDER BY e.transactionDate DESC")
    Page<Expense> findByUserAndStartDateAndTags(
        @Param("user") User user,
        @Param("startDate") LocalDateTime startDate,
        @Param("tagIds") List<Long> tagIds,
        Pageable pageable
    );
    
    @Query("SELECT DISTINCT e FROM Expense e " +
           "LEFT JOIN e.tags t " +
           "WHERE e.user = :user " +
           "AND e.transactionDate >= :startDate " +
           "AND e.category.id IN :categoryIds " +
           "AND t.id IN :tagIds " +
           "ORDER BY e.transactionDate DESC")
    Page<Expense> findByUserAndStartDateAndCategoriesAndTags(
        @Param("user") User user,
        @Param("startDate") LocalDateTime startDate,
        @Param("categoryIds") List<Long> categoryIds,
        @Param("tagIds") List<Long> tagIds,
        Pageable pageable
    );
    
    @Query("SELECT DISTINCT e FROM Expense e " +
           "WHERE e.user = :user " +
           "AND e.transactionDate <= :endDate " +
           "AND e.category.id IN :categoryIds " +
           "ORDER BY e.transactionDate DESC")
    Page<Expense> findByUserAndEndDateAndCategories(
        @Param("user") User user,
        @Param("endDate") LocalDateTime endDate,
        @Param("categoryIds") List<Long> categoryIds,
        Pageable pageable
    );
    
    @Query("SELECT DISTINCT e FROM Expense e " +
           "LEFT JOIN e.tags t " +
           "WHERE e.user = :user " +
           "AND e.transactionDate <= :endDate " +
           "AND t.id IN :tagIds " +
           "ORDER BY e.transactionDate DESC")
    Page<Expense> findByUserAndEndDateAndTags(
        @Param("user") User user,
        @Param("endDate") LocalDateTime endDate,
        @Param("tagIds") List<Long> tagIds,
        Pageable pageable
    );
    
    @Query("SELECT DISTINCT e FROM Expense e " +
           "LEFT JOIN e.tags t " +
           "WHERE e.user = :user " +
           "AND e.transactionDate <= :endDate " +
           "AND e.category.id IN :categoryIds " +
           "AND t.id IN :tagIds " +
           "ORDER BY e.transactionDate DESC")
    Page<Expense> findByUserAndEndDateAndCategoriesAndTags(
        @Param("user") User user,
        @Param("endDate") LocalDateTime endDate,
        @Param("categoryIds") List<Long> categoryIds,
        @Param("tagIds") List<Long> tagIds,
        Pageable pageable
    );

    // Combined filters
    @Query("SELECT DISTINCT e FROM Expense e " +
           "LEFT JOIN e.tags t " +
           "WHERE e.user = :user " +
           "AND e.category.id IN :categoryIds " +
           "AND t.id IN :tagIds " +
           "ORDER BY e.transactionDate DESC")
    Page<Expense> findByUserAndCategoriesAndTags(
        @Param("user") User user,
        @Param("categoryIds") List<Long> categoryIds,
        @Param("tagIds") List<Long> tagIds,
        Pageable pageable
    );
    
    @Query("SELECT DISTINCT e FROM Expense e " +
           "LEFT JOIN e.tags t " +
           "WHERE e.user = :user " +
           "AND e.transactionDate >= :startDate " +
           "AND e.transactionDate <= :endDate " +
           "AND e.category.id IN :categoryIds " +
           "AND t.id IN :tagIds " +
           "ORDER BY e.transactionDate DESC")
    Page<Expense> findByUserAndDateRangeAndCategoriesAndTags(
        @Param("user") User user,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        @Param("categoryIds") List<Long> categoryIds,
        @Param("tagIds") List<Long> tagIds,
        Pageable pageable
    );
}
