
package com.gamevault.controller;

import com.gamevault.entity.Setting;
import com.gamevault.repository.SettingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    @Autowired
    private SettingRepository settingRepository;

    @GetMapping("/{key}")
    public Setting getSetting(@PathVariable String key) {
        // Try find by ID (since key is the @Id)
        return settingRepository.findById(key)
                .orElse(new Setting(key, ""));
    }

    @PostMapping("/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public Setting saveSetting(@PathVariable String key, @RequestBody Map<String, String> body) {
        String value = body.get("value");
        
        // Robust UPSERT: Check if it exists first to ensure we act on the attached entity
        Optional<Setting> existing = settingRepository.findById(key);
        if (existing.isPresent()) {
            Setting s = existing.get();
            s.setValue(value);
            return settingRepository.save(s);
        } else {
            return settingRepository.save(new Setting(key, value));
        }
    }
}
