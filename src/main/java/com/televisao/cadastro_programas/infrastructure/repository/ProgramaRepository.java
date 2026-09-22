package com.televisao.cadastro_programas.infrastructure.repository;

import com.televisao.cadastro_programas.infrastructure.entitys.Programa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface ProgramaRepository extends JpaRepository<Programa, Integer> {

    Optional<Programa> findByNomeContainingIgnoreCase(String nome);

    @Transactional
    void deleteByNome(String nome);
}
