using Breeze.ContextProvider;
using Breeze.ContextProvider.NH;
using Models.NorthwindIB.NH;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;


namespace NorthBreeze.Controllers
{
    [BreezeNHController]
    public class NorthBreezeController : ApiController
    {
        private NorthwindContext northwind;

        //Dictionary<storeId, Tuple<detaultState, Dictionary<stateName, data>>>
        private static readonly Dictionary<string, Tuple<string, Dictionary<string, object>>> DtStates = new Dictionary<string, Tuple<string, Dictionary<string, object>>>();

        static NorthBreezeController() { }

        protected override void Initialize(System.Web.Http.Controllers.HttpControllerContext controllerContext)
        {
            base.Initialize(controllerContext);
            northwind = new NorthwindContext();
        }

        [HttpPost]
        public object RemoteState(JObject state)
        {
            var action = state.GetValue("action").Value<string>();
            var storeId = state.GetValue("storeId").Value<string>();
            var stateName = state.GetValue("stateName").Value<string>();
            var data = state.GetValue("data").Value<JObject>();
            switch (action)
            {
                case "getAll":
                    return DtStates.ContainsKey(storeId) 
                        ? new
                            {
                                defaultState = DtStates[storeId].Item1,
                                states = DtStates[storeId].Item2
                            } 
                        : new object();
                case "setDefault":
                    if (DtStates.ContainsKey(storeId))
                        DtStates[storeId] = new Tuple<string, Dictionary<string, object>>(stateName, DtStates[storeId].Item2);
                    break;
                case "delete":
                    if (DtStates.ContainsKey(storeId) && DtStates[storeId].Item2.ContainsKey(stateName))
                        DtStates[storeId].Item2.Remove(stateName);
                    break;
                case "save":
                    if (!DtStates.ContainsKey(storeId))
                        DtStates[storeId] = new Tuple<string, Dictionary<string, object>>(null, new Dictionary<string, object>());
                    DtStates[storeId].Item2[stateName] = data;
                    break;
            }
            return null;
        }

        [HttpGet]
        public String Metadata()
        {
            return northwind.Metadata();
        }

        [HttpPost]
        public SaveResult SaveChanges(JObject saveBundle)
        {
            return northwind.SaveChanges(saveBundle);
        }

        [HttpGet]
        public IQueryable<Customer> Customers()
        {
            var custs = northwind.Customers;
            return custs;
        }

        [HttpGet]
        public IQueryable<Order> Orders()
        {
            var orders = northwind.Orders;
            return orders;
        }

        [HttpGet]
        public IQueryable<OrderDetail> OrderDetails()
        {
            var query = northwind.OrderDetails;
            return query;
        }

        [HttpGet]
        public IQueryable<Employee> Employees()
        {
            return northwind.Employees;
        }

        [HttpGet]
        public IQueryable<Product> Products()
        {
            return northwind.Products;
        }

        [HttpGet]
        public IQueryable<Supplier> Suppliers()
        {
            return northwind.Suppliers;
        }

        [HttpGet]
        public IQueryable<Region> Regions()
        {
            return northwind.Regions;
        }

        [HttpGet]
        public IQueryable<Territory> Territories()
        {
            return northwind.Territories;
        }

        [HttpGet]
        public IQueryable<Category> Categories()
        {
            return northwind.Categories;
        }

        [HttpGet]
        public IQueryable<Role> Roles()
        {
            return northwind.Roles;
        }

        [HttpGet]
        public IQueryable<User> Users()
        {
            return northwind.Users;
        }

   }
}