package com.budgetwise.controller;

import com.budgetwise.dto.SettingsRequest;
import com.budgetwise.dto.SettingsResponse;
import com.budgetwise.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;

    /**
     * Get current user's settings (protected)
     */
    @GetMapping
    public ResponseEntity<?> getSettings() {
        try {
            SettingsResponse settings = settingsService.getSettings();
            return ResponseEntity.ok(settings);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse(400, ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(500, "Internal server error"));
        }
    }

    /**
     * Update current user's settings (protected)
     */
    @PutMapping
    public ResponseEntity<?> updateSettings(@RequestBody SettingsRequest request) {
        try {
            SettingsResponse settings = settingsService.updateSettings(request);
            return ResponseEntity.ok(settings);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse(400, ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(500, "Internal server error"));
        }
    }

    // Helper for uniform error responses
    private ErrorResponse createErrorResponse(int status, String message) {
        return new ErrorResponse(status, message);
    }

    private record ErrorResponse(int status, String message) {}
}
