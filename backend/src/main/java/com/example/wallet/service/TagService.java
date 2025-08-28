package com.example.wallet.service;

import com.example.wallet.dto.TagRequest;
import com.example.wallet.model.Tag;
import com.example.wallet.model.User;
import com.example.wallet.repository.TagRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TagService {
    private final TagRepository tagRepository;

    public TagService(TagRepository tagRepository) {
        this.tagRepository = tagRepository;
    }

    public Tag create(User owner, TagRequest req) {
        Tag t = new Tag();
        t.setName(req.getName());
        t.setOwner(owner);
        t.setIsSystem(false); // User-created tags are not system tags
        return tagRepository.save(t);
    }

    public List<Tag> list(User owner) {
        return tagRepository.findByOwnerOrSystemTags(owner);
    }
}
