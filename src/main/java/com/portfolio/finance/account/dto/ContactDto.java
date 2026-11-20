package com.portfolio.finance.account.dto;

import com.portfolio.finance.account.Contact;

public record ContactDto(
        Long id,
        String name,
        String email,
        String phone
) {
    public static ContactDto from(Contact contact) {
        if (contact == null) {
            return null;
        }
        return new ContactDto(
                contact.getId(),
                contact.getName(),
                contact.getEmail(),
                contact.getPhone()
        );
    }
}
