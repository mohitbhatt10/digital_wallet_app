package com.example.wallet.service;

import com.example.wallet.model.Role;
import com.example.wallet.model.User;
import com.example.wallet.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Set;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User registerLocal(User u) {
        u.setPassword(encoder.encode(u.getPassword()));
        u.setRoles(Set.of(Role.USER));
        return userRepository.save(u);
    }

    public User findByUsernameOrEmail(String input) {
        return userRepository.findByUsername(input)
            .or(() -> userRepository.findByEmail(input))
            .orElse(null);
    }

    public boolean emailExists(String email) { return userRepository.existsByEmail(email); }
    public boolean usernameExists(String username) { return userRepository.existsByUsername(username); }

    public boolean passwordMatches(String raw, String encoded) {
        return encoder.matches(raw, encoded);
    }
}
