package com.example.wallet.security;

import com.example.wallet.model.AuthProvider;
import com.example.wallet.model.Role;
import com.example.wallet.model.User;
import com.example.wallet.repository.UserRepository;
import com.example.wallet.service.JwtService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Set;

@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {
    private final UserRepository userRepository;
    private final JwtService jwtService;

    // Frontend dashboard route will parse token from query param
    private final String frontendCallback;

    public OAuth2SuccessHandler(UserRepository userRepository, JwtService jwtService,
                                @Value("${wallet.frontend.dashboard:http://localhost:5173/dashboard}") String frontendCallback) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.frontendCallback = frontendCallback;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User principal = (OAuth2User) authentication.getPrincipal();
        String email = (String) principal.getAttributes().getOrDefault("email", "");
        String name = (String) principal.getAttributes().getOrDefault("name", "");
        String givenName = (String) principal.getAttributes().getOrDefault("given_name", "");
        String familyName = (String) principal.getAttributes().getOrDefault("family_name", "");
        String locale = (String) principal.getAttributes().getOrDefault("locale", "IN");
        String country = locale != null ? locale : "India";
        String currency = getCurrencyForCountry(locale);


        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User u = new User();
            u.setEmail(email);
            String username;
            if (email != null && email.contains("@")) {
                username = email.substring(0, email.indexOf('@'));
            } else {
                username = name.replaceAll("\\s+", "").toLowerCase();
            }
            String base = username;
            int i = 1;
            while (userRepository.existsByUsername(username)) {
                username = base + i++;
            }
            u.setUsername(username);
            u.setFirstName(givenName);
            u.setLastName(familyName);
            u.setProvider(AuthProvider.GOOGLE);
            u.setRoles(Set.of(Role.USER));
            u.setCountry(country);
            u.setCurrency(currency);
            return userRepository.save(u);
        });

        String token = jwtService.generate(user.getUsername(), java.util.Map.of("uid", user.getId()));
        String redirect = frontendCallback + (frontendCallback.contains("?") ? "&" : "?") + "token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
        response.sendRedirect(redirect);
    }

    private String getCurrencyForCountry(String countryCode) {
        if (countryCode == null) return "INR";
        return switch (countryCode.toUpperCase()) {
            case "US", "USA" -> "USD";
            case "GB", "UK" -> "GBP";
            case "EU", "EUR" -> "EUR";
            case "JP", "JPN" -> "JPY";
            case "IN", "IND" -> "INR";
            case "CA", "CAN" -> "CAD";
            case "AU", "AUS" -> "AUD";
            case "SG", "SGP" -> "SGD";
            case "CH", "CHE" -> "CHF";
            case "CN", "CHN" -> "CNY";
            case "NZ", "NZL" -> "NZD";
            default -> "INR"; // Default to INR if unknown
        };
    }
}
