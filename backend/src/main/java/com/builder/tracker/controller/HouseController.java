package com.builder.tracker.controller;

import com.builder.tracker.entity.House;
import com.builder.tracker.entity.User;
import com.builder.tracker.repository.HouseRepository;
import com.builder.tracker.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/houses")
public class HouseController {

    private final HouseRepository houseRepository;
    private final UserRepository userRepository;

    public HouseController(HouseRepository houseRepository, UserRepository userRepository) {
        this.houseRepository = houseRepository;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
    }

    @GetMapping
    public ResponseEntity<List<House>> getHouses(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        return ResponseEntity.ok(houseRepository.findByUserId(user.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<House> getHouse(@PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        return houseRepository.findByIdAndUserId(id, user.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
    }

    @PostMapping
    public ResponseEntity<House> createHouse(@RequestBody House house, @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        house.setUser(user);
        return ResponseEntity.ok(houseRepository.save(house));
    }

    @Transactional
    @PutMapping("/{id}")
    public ResponseEntity<House> updateHouse(@PathVariable Long id, @RequestBody House houseDetails, @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        return houseRepository.findByIdAndUserId(id, user.getId())
                .map(existingHouse -> {
                    existingHouse.setName(houseDetails.getName());
                    existingHouse.setLocation(houseDetails.getLocation());
                    existingHouse.setStartDate(houseDetails.getStartDate());
                    existingHouse.setEndDate(houseDetails.getEndDate());
                    existingHouse.setSalePrice(houseDetails.getSalePrice());
                    existingHouse.setStatus(houseDetails.getStatus());
                    existingHouse.setSitePhotos(houseDetails.getSitePhotos());
                    return ResponseEntity.ok(houseRepository.save(existingHouse));
                })
                .orElse(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
    }

    @Transactional
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHouse(@PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        return houseRepository.findByIdAndUserId(id, user.getId())
                .map(existingHouse -> {
                    houseRepository.delete(existingHouse);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
    }
}
