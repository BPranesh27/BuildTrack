package com.builder.tracker.repository;

import com.builder.tracker.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByHouseIdOrderByExpenseDateDesc(Long houseId);
    
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.house.id = :houseId")
    BigDecimal getTotalByHouseId(Long houseId);
    
    // Using Object[] because JPQL map projection needs alias handling, easier to map later
    @Query("SELECT e.category as category, SUM(e.amount) as total FROM Expense e WHERE e.house.id = :houseId GROUP BY e.category")
    List<Map<String, Object>> getCategoryTotalsByHouseId(Long houseId);
}
