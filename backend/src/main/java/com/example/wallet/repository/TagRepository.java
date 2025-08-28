package com.example.wallet.repository;

import com.example.wallet.model.Tag;
import com.example.wallet.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface TagRepository extends JpaRepository<Tag, Long> {
    List<Tag> findByOwner(User owner);

    List<Tag> findByIsSystemTrue();

    @Query("SELECT t FROM Tag t WHERE t.owner = ?1 OR t.isSystem = true ORDER BY t.isSystem DESC, t.name ASC")
    List<Tag> findByOwnerOrSystemTags(User owner);
}
