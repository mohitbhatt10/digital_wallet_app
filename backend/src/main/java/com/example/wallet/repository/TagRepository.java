package com.example.wallet.repository;

import com.example.wallet.model.Tag;
import com.example.wallet.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TagRepository extends JpaRepository<Tag, Long> {
    List<Tag> findByOwner(User owner);
}
