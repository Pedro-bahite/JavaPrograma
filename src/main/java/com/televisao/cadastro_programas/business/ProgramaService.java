package com.televisao.cadastro_programas.business;

import com.televisao.cadastro_programas.infrastructure.entitys.Programa;
import com.televisao.cadastro_programas.infrastructure.repository.ProgramaRepository;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProgramaService {

    private final ProgramaRepository repository;

    public ProgramaService(ProgramaRepository repository){
        this.repository = repository;
    }

    public void salvarPrograma(Programa programa){
        repository.saveAndFlush(programa);
    }

    public List<Programa> buscarProgramasPorNome(String nome) {
        if (nome == null || nome.trim().isEmpty()) {
            return buscarTodosProgramas();
        }

        String nomeNormalizado = removerAcentos(nome.toLowerCase().trim());

        return repository.findAll().stream()
                .filter(p -> p.getNome() != null &&
                        removerAcentos(p.getNome().toLowerCase()).contains(nomeNormalizado))
                .collect(Collectors.toList());
    }

    private String removerAcentos(String str) {
        if (str == null) return "";
        return Normalizer.normalize(str, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
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