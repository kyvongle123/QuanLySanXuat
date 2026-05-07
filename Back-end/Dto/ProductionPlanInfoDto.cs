using System;
using System.Collections.Generic;

namespace MyProject.Dto
{
    public class ProductionPlanInfoDto
    {
        public int Id { get; set; }
        public string PlanCode { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? Status { get; set; }
        public int? Warehouse { get; set; }
        public string Note { get; set; }
        public List<ProductionPlanItemDto> ProductionPlanItemList { get; set; }
    }

    public class ProductionPlanItemDto
    {
        public int Id { get; set; }
        public int Item { get; set; }
        public int Quantity { get; set; }
    }
}