package com.televisao.cadastro_programas.business;

import com.televisao.cadastro_programas.infrastructure.entitys.Programa;
import com.televisao.cadastro_programas.infrastructure.repository.ProgramaRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProgramaService {

    private final ProgramaRepository repository;

    public ProgramaService(ProgramaRepository repository){
        this.repository = repository;
    }

    public void salvarPrograma(Programa programa){
        repository.saveAndFlush(programa);
    }

    public Programa buscarProgramaPorNome(String nome){
        return repository.findByNomeContainingIgnoreCase(nome).orElseThrow(
                () -> new RuntimeException("Nome não encontrado!!")
        );

    }

    public void deletarProgramaPornome(String nome){
        repository.deleteByNome(nome);
    }

    public void atualizarProgramaPorId(Integer id, Programa programa){
        Programa programaEntity = repository.findById(id).orElseThrow(() ->
                new RuntimeException("Programa nao encontrado"));
        Programa programaAtualizado = Programa.builder()
                .id(programaEntity.getId())
                .nome(programa.getNome() != null ? programa.getNome() : programaEntity.getNome())
                .categoria(programa.getCategoria() != null ? programa.getCategoria() : programaEntity.getCategoria())
                .emissora(programa.getEmissora() != null ? programa.getEmissora() : programaEntity.getEmissora())
                .class_indic(programa.getClass_indic() != null ? programa.getClass_indic() : programaEntity.getClass_indic())
                .build();

        repository.saveAndFlush(programaAtualizado);

    }

    public List<Programa> buscarTodosProgramas() {
        return repository.findAll();
    }


    public Programa buscarProgramaPorId(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Programa não encontrado com o ID: " + id));
    }
}
