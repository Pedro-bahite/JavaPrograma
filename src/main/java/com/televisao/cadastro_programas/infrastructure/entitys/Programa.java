package com.televisao.cadastro_programas.infrastructure.entitys;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "programa")
@Entity

public class Programa {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;

    @Column(name = "nome", unique = true, length = 25)
    private String nome;

    @Column(name = "categoria", length = 25)
    private String categoria;

    @Column(name = "emissora", length = 25)
    private String emissora;

    @Column(name = "class_indic", length = 25)
    private String class_indic;
}
