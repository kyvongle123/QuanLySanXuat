using System;
using System.Collections.Generic;

namespace MyProject.Dto
{
    public class CreateProductionPlanDto
    {
        public string PlanCode { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? Status { get; set; }
        public int? Warehouse { get; set; }
        public string Note { get; set; }
        public List<CreateProductionPlanItemDto> ProductionPlanItemList { get; set; }
    }

    public class CreateProductionPlanItemDto
    {
        public int Item { get; set; }
        public int Quantity { get; set; }
    }
}