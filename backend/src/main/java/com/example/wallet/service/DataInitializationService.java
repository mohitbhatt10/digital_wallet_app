package com.example.wallet.service;

import com.example.wallet.model.Tag;
import com.example.wallet.repository.TagRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class DataInitializationService implements CommandLineRunner {
    private final TagRepository tagRepository;

    public DataInitializationService(TagRepository tagRepository) {
        this.tagRepository = tagRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        initializePredefinedTags();
    }

    private void initializePredefinedTags() {
        // Check if system tags already exist
        List<Tag> existingSystemTags = tagRepository.findByIsSystemTrue();
        if (!existingSystemTags.isEmpty()) {
            return; // System tags already initialized
        }

        // Define predefined tags with categories
        List<String> predefinedTagNames = Arrays.asList(
                // Priority & Urgency
                "Urgent", "High Priority", "Low Priority", "Emergency",

                // Payment Context
                "Cash Payment", "Online Payment", "Card Payment", "Mobile Payment", "Bank Transfer",

                // Location & Context
                "Work", "Personal", "Home", "Office", "Travel", "Business Trip", "Vacation",

                // Time-based
                "Weekly", "Monthly", "Daily", "One-time", "Recurring", "Annual",

                // Financial Categories
                "Tax Deductible", "Reimbursable", "Investment", "Savings", "Debt", "Loan",

                // Lifestyle
                "Health", "Fitness", "Education", "Entertainment", "Social", "Family",

                // Quality & Type
                "Essential", "Optional", "Luxury", "Necessity", "Planned", "Unplanned",

                // Special Occasions
                "Birthday", "Anniversary", "Holiday", "Gift", "Celebration", "Special Event",

                // Work-related
                "Business Expense", "Office Supplies", "Professional Development", "Networking",

                // Maintenance & Services
                "Maintenance", "Repair", "Service", "Subscription", "Membership",

                // Food & Dining
                "Fast Food", "Restaurant", "Groceries", "Takeout", "Dining Out",

                // Transportation
                "Public Transport", "Fuel", "Parking", "Taxi", "Ride Share",

                // Shopping
                "Online Shopping", "In-Store", "Bulk Purchase", "Sale", "Discount");

        // Create and save system tags
        for (String tagName : predefinedTagNames) {
            Tag systemTag = new Tag();
            systemTag.setName(tagName);
            systemTag.setIsSystem(true);
            systemTag.setOwner(null); // System tags have no owner
            tagRepository.save(systemTag);
        }

        System.out.println("Initialized " + predefinedTagNames.size() + " predefined system tags");
    }
}
