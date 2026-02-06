package esiea.hackathon.leaders.application.dto.request;

import esiea.hackathon.leaders.domain.model.HexCoord;
import java.util.List;
import java.util.UUID;

public record RecruitmentRequestDto(
        UUID cardId,
        List<HexCoord> placements // Liste car le Duo Ours en demande 2
) {}