package com.builder.tracker.controller;

import com.builder.tracker.entity.Expense;
import com.builder.tracker.entity.House;
import com.builder.tracker.entity.User;
import com.builder.tracker.repository.ExpenseRepository;
import com.builder.tracker.repository.HouseRepository;
import com.builder.tracker.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseRepository expenseRepository;
    private final HouseRepository houseRepository;
    private final UserRepository userRepository;

    public ExpenseController(ExpenseRepository expenseRepository, HouseRepository houseRepository, UserRepository userRepository) {
        this.expenseRepository = expenseRepository;
        this.houseRepository = houseRepository;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
    }

    private Optional<House> verifyHouseOwnership(Long houseId, User user) {
        return houseRepository.findByIdAndUserId(houseId, user.getId());
    }

    @GetMapping("/house/{houseId}")
    public ResponseEntity<List<Expense>> getExpenses(@PathVariable Long houseId, @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        Optional<House> houseOpt = verifyHouseOwnership(houseId, user);
        
        if (houseOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(expenseRepository.findByHouseIdOrderByExpenseDateDesc(houseId));
    }

    @GetMapping("/house/{houseId}/total")
    public ResponseEntity<BigDecimal> getTotalExpenses(@PathVariable Long houseId, @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        if (verifyHouseOwnership(houseId, user).isEmpty()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(expenseRepository.getTotalByHouseId(houseId));
    }

    @GetMapping("/house/{houseId}/category-summary")
    public ResponseEntity<List<Map<String, Object>>> getCategorySummary(@PathVariable Long houseId, @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        if (verifyHouseOwnership(houseId, user).isEmpty()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(expenseRepository.getCategoryTotalsByHouseId(houseId));
    }

    @PostMapping
    public ResponseEntity<Expense> createExpense(@RequestBody Expense expense, @AuthenticationPrincipal UserDetails userDetails) {
        if (expense.getHouse() == null || expense.getHouse().getId() == null) {
            return ResponseEntity.badRequest().build();
        }
        
        User user = getAuthenticatedUser(userDetails);
        Optional<House> houseOpt = verifyHouseOwnership(expense.getHouse().getId(), user);
        
        if (houseOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        expense.setHouse(houseOpt.get());
        return ResponseEntity.ok(expenseRepository.save(expense));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Expense> updateExpense(@PathVariable Long id, @RequestBody Expense expenseDetails, @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        
        return expenseRepository.findById(id).map(existing -> {
            // Verify ownership of the house the expense already belongs to
            if (verifyHouseOwnership(existing.getHouse().getId(), user).isEmpty()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).<Expense>build();
            }
            
            // If changing the house, verify ownership of the new house too
            if (expenseDetails.getHouse() != null && expenseDetails.getHouse().getId() != null 
                    && !expenseDetails.getHouse().getId().equals(existing.getHouse().getId())) {
                Optional<House> newHouseOpt = verifyHouseOwnership(expenseDetails.getHouse().getId(), user);
                if (newHouseOpt.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).<Expense>build();
                }
                existing.setHouse(newHouseOpt.get());
            }

            existing.setCategory(expenseDetails.getCategory());
            existing.setDescription(expenseDetails.getDescription());
            existing.setAmount(expenseDetails.getAmount());
            existing.setExpenseDate(expenseDetails.getExpenseDate());
            
            return ResponseEntity.ok(expenseRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(@PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        
        return expenseRepository.findById(id).map(existing -> {
            if (verifyHouseOwnership(existing.getHouse().getId(), user).isEmpty()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).<Void>build();
            }
            
            expenseRepository.delete(existing);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
